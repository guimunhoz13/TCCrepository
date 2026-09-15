from rest_framework.pagination import PageNumberPagination


class PaginacaoPadrao(PageNumberPagination):
    """Paginação padrão da API. Permite que uma requisição específica peça
    uma página maior (ex.: para popular um <select> com todos os registros)
    via ?page_size=, respeitando um teto para evitar abuso.
    """

    # O frontend hoje consome listas completas (sem paginador na UI) para
    # montar dashboards, dropdowns e o assistente de IA — um page_size baixo
    # quebraria essas telas. 200 evita truncar dados reais de um escritório
    # de porte pequeno/médio, mas ainda protege a API contra respostas
    # arbitrariamente grandes (ex.: milhares de registros de uma vez).
    page_size = 200
    page_size_query_param = "page_size"
    max_page_size = 1000
